import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, RoutingStrategy, LeadStatus, LeadSource } from '@prisma/client';

export interface UpdateRoutingSettingsDto {
  isEnabled?: boolean;
  strategy?: RoutingStrategy;
  highScoreThreshold?: number;
  excludedUserIds?: string[];
}

export interface StaffPerformanceStat {
  userId: string;
  name: string;
  email: string;
  role: Role;
  isEligible: boolean;
  activeOpenLeads: number;
  recentLeadsAssigned: number;
  recentBookingsWon: number;
  conversionRate: number; // percentage e.g. 24.5
}

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves or initializes singleton lead routing configuration.
   */
  async getRoutingSettings() {
    let settings = await this.prisma.leadRoutingSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.leadRoutingSettings.create({
        data: {
          id: 'default',
          isEnabled: true,
          strategy: RoutingStrategy.ROUND_ROBIN,
          highScoreThreshold: 60,
          excludedUserIds: [],
        },
      });
    }

    return settings;
  }

  /**
   * Updates lead routing configuration.
   */
  async updateRoutingSettings(dto: UpdateRoutingSettingsDto) {
    await this.getRoutingSettings(); // ensure initialized

    return this.prisma.leadRoutingSettings.update({
      where: { id: 'default' },
      data: {
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
        ...(dto.strategy ? { strategy: dto.strategy } : {}),
        ...(dto.highScoreThreshold !== undefined ? { highScoreThreshold: dto.highScoreThreshold } : {}),
        ...(dto.excludedUserIds ? { excludedUserIds: dto.excludedUserIds } : {}),
      },
    });
  }

  /**
   * Computes 30-day conversion statistics and workload capacity across sales staff.
   */
  async getStaffPerformanceStats(): Promise<StaffPerformanceStat[]> {
    const settings = await this.getRoutingSettings();
    const excludedSet = new Set(settings.excludedUserIds || []);

    const users = await this.prisma.user.findMany({
      where: {
        role: { in: [Role.SALES_EXEC, Role.SALES_MANAGER] },
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats: StaffPerformanceStat[] = [];

    for (const u of users) {
      const [activeOpenLeads, recentLeadsAssigned, recentBookingsWon] = await Promise.all([
        this.prisma.lead.count({
          where: {
            assignedToId: u.id,
            status: { notIn: [LeadStatus.CONFIRMED, LeadStatus.LOST, LeadStatus.CANCELLED] },
          },
        }),
        this.prisma.lead.count({
          where: {
            assignedToId: u.id,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.booking.count({
          where: {
            createdById: u.id,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);

      const conversionRate =
        recentLeadsAssigned > 0
          ? Number(((recentBookingsWon / recentLeadsAssigned) * 100).toFixed(1))
          : 0.0;

      stats.push({
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isEligible: !excludedSet.has(u.id),
        activeOpenLeads,
        recentLeadsAssigned,
        recentBookingsWon,
        conversionRate,
      });
    }

    return stats;
  }

  /**
   * Evaluates the active routing strategy and assigns an incoming lead to the best sales agent.
   */
  async assignNewLead(
    leadScore: number = 0,
    source: LeadSource = LeadSource.OTHER,
  ): Promise<{ assignedToId: string | null; strategy: RoutingStrategy; reason: string }> {
    const settings = await this.getRoutingSettings();

    if (!settings.isEnabled || settings.strategy === RoutingStrategy.MANUAL) {
      return {
        assignedToId: null,
        strategy: settings.strategy,
        reason: 'Auto-assignment is disabled or set to MANUAL.',
      };
    }

    const excludedSet = new Set(settings.excludedUserIds || []);
    const eligibleUsers = await this.prisma.user.findMany({
      where: {
        role: { in: [Role.SALES_EXEC, Role.SALES_MANAGER] },
        isActive: true,
        id: { notIn: Array.from(excludedSet) },
      },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });

    if (eligibleUsers.length === 0) {
      this.logger.warn('No eligible sales staff available for auto-assignment.');
      return {
        assignedToId: null,
        strategy: settings.strategy,
        reason: 'No eligible active sales staff available.',
      };
    }

    // ── Strategy: PERFORMANCE_WEIGHTED ──────────────────────────────────────
    if (settings.strategy === RoutingStrategy.PERFORMANCE_WEIGHTED) {
      if (leadScore >= settings.highScoreThreshold) {
        const stats = await this.getStaffPerformanceStats();
        const eligibleStats = stats
          .filter((s) => s.isEligible)
          .sort((a, b) => b.conversionRate - a.conversionRate || a.activeOpenLeads - b.activeOpenLeads);

        if (eligibleStats.length > 0) {
          const topAgent = eligibleStats[0];
          await this.updateLastAssigned(topAgent.userId);

          return {
            assignedToId: topAgent.userId,
            strategy: RoutingStrategy.PERFORMANCE_WEIGHTED,
            reason: `High intent lead (Score ${leadScore} ≥ ${settings.highScoreThreshold}) routed to top-converting agent (${topAgent.name} · ${topAgent.conversionRate}% conversion)`,
          };
        }
      }
      // Below threshold -> Fallback to round-robin
    }

    // ── Strategy: LOAD_BALANCED ─────────────────────────────────────────────
    if (settings.strategy === RoutingStrategy.LOAD_BALANCED) {
      const stats = await this.getStaffPerformanceStats();
      const eligibleStats = stats
        .filter((s) => s.isEligible)
        .sort((a, b) => a.activeOpenLeads - b.activeOpenLeads);

      if (eligibleStats.length > 0) {
        const lightestAgent = eligibleStats[0];
        await this.updateLastAssigned(lightestAgent.userId);

        return {
          assignedToId: lightestAgent.userId,
          strategy: RoutingStrategy.LOAD_BALANCED,
          reason: `Capacity routed to agent with lightest workload (${lightestAgent.name} · ${lightestAgent.activeOpenLeads} active leads)`,
        };
      }
    }

    // ── Strategy: ROUND_ROBIN (Default & Fallback) ──────────────────────────
    const lastId = settings.lastAssignedUserId;
    let nextIndex = 0;

    if (lastId) {
      const lastIndex = eligibleUsers.findIndex((u) => u.id === lastId);
      if (lastIndex !== -1) {
        nextIndex = (lastIndex + 1) % eligibleUsers.length;
      }
    }

    const selectedUser = eligibleUsers[nextIndex];
    await this.updateLastAssigned(selectedUser.id);

    return {
      assignedToId: selectedUser.id,
      strategy: RoutingStrategy.ROUND_ROBIN,
      reason: `Round-robin sequential assignment to ${selectedUser.name}`,
    };
  }

  private async updateLastAssigned(userId: string) {
    try {
      await this.prisma.leadRoutingSettings.update({
        where: { id: 'default' },
        data: { lastAssignedUserId: userId },
      });
    } catch (e) {
      this.logger.error('Failed to update lastAssignedUserId', e);
    }
  }
}
