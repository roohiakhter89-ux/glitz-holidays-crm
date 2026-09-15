import { Module } from '@nestjs/common';
import { MlScoringService } from './ml-scoring.service';
import { MlForecastingService } from './ml-forecasting.service';
import { MlClusteringService } from './ml-clustering.service';
import { MlController } from './ml.controller';

@Module({
  providers: [MlScoringService, MlForecastingService, MlClusteringService],
  controllers: [MlController],
  exports: [MlScoringService, MlForecastingService, MlClusteringService],
})
export class MlModule {}
