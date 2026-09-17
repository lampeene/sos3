import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlacesController {
  constructor(private placesService: PlacesService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.placesService.findAll({
      search,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.placesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePlaceDto) {
    return this.placesService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreatePlaceDto>) {
    return this.placesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.placesService.remove(id);
  }
}
