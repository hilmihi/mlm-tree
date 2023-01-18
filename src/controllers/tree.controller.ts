import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TreeService } from '../services/tree.service';
import { MemberDocument } from '../schemas/tree.schema';
import { MigrateMemberDto } from '../dto/migrate.dto';
import { CreateMemberDto } from '../dto/create.dto';
import { resourceUsage } from 'process';

@Controller('tree')
export class TreeController {
  constructor(private readonly treeService: TreeService) {}

  @Post()
  async create(@Body() tree: CreateMemberDto) {
    return this.treeService.create(tree);
  }

  @Get()
  async findAll(): Promise<MemberDocument[]> {
    return this.treeService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MemberDocument> {
    return this.treeService.findOne(id);
  }

  @Put()
  async update(@Body() migrateData: MigrateMemberDto) {
    return this.treeService.migrate(migrateData.id, migrateData.newParent);
  }

  @Delete()
  async delete() {
    console.log('dicobaaneh');
    return this.treeService.aneh();
  }
}
