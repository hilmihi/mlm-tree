/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MemberDocument } from '../schemas/tree.schema';
import { CreateMemberDto } from 'src/dto/create.dto';

@Injectable()
export class TreeService {
  constructor(
    @InjectModel('Member')
    private readonly treeModel: mongoose.Model<MemberDocument>,
  ) {}

  async create(tree: CreateMemberDto): Promise<MemberDocument> {
    const withoutChild = {
      value: tree.value,
      level: 1,
      bonus: 0,
      parent: null,
      children: new Map<string, MemberDocument>(),
    };
    
    if (tree.parent!='') {
      withoutChild.parent = tree.parent;
    }
    await this.reEvaluateBonusByChild(withoutChild);

    if (tree.parent != null && tree.parent!='') {
      withoutChild.level = await this.findNodeLevel(withoutChild);
      
      const createdTree = await this.treeModel.create(withoutChild);

      const parentTree = await this.updateTillRoot(createdTree, 'plus', 0);

      return await parentTree.save();
    }

    const createdTree = await this.treeModel.create(withoutChild);

    return await createdTree.save();
  }

  async findAll(): Promise<MemberDocument[]> {
    return this.treeModel.find({level: 1}).exec();
  }

  async findOne(id: string): Promise<any> {
    return this.treeModel.findById(id).exec();
  }

  async migrate(id: string, newParent?: string): Promise<MemberDocument> {
    const node = await this.treeModel.findById(id).exec();
    if (node.parent) {
      const oldParentNode = await this.treeModel.findById(node.parent).exec();
      if (oldParentNode._id.toString() == newParent) {
        return oldParentNode;
      }

      oldParentNode.children.delete(node._id.toString());
      oldParentNode.bonus = oldParentNode.bonus - (await this.reEvaluateBonusParentByMigratedChild(node));
      await oldParentNode.save();
      await this.updateTillRoot(oldParentNode, 'minus');
    }

    const newParentNode = await this.treeModel.findById(newParent).exec();
    if (!newParentNode) {
      node.parent = null;
      return await node.save();
    }
    
    node.parent = newParentNode;
    const newLevel = await this.reEvaluateNodeLevel(node, newParentNode);
    newParentNode.children.set(newLevel._id.toString(), await this.treeModel.findById(newLevel._id).exec());
    newParentNode.bonus = newParentNode.bonus + (await this.reEvaluateBonusParentByMigratedChild(newLevel));
    await newParentNode.save();
    
    return this.updateTillRootForMigrate(newParentNode);
    return
  }

  async delete(id: string): Promise<MemberDocument> {
    return this.treeModel
      .deleteOne({ _id: id })
      .exec() as unknown as MemberDocument;
  }

  async findNodeLevel(currentNode, level = 1): Promise<number> {
    if (!currentNode.parent) return level;
    const node = await this.treeModel.findById(currentNode.parent).exec();
    return node.level + 1;
  }

  async reEvaluateNodeLevel(
    currentNode: MemberDocument,
    parentNode?: MemberDocument,
  ): Promise<MemberDocument> {
    currentNode.level = 1;
    if (parentNode) {
      currentNode.level = parentNode.level + 1;
    }

    if (currentNode.children.size > 0) {
      currentNode.children.forEach(async (value: MemberDocument, key: string) => {
        currentNode.children.set(key, await this.reEvaluateNodeLevel(
          value,
          currentNode,
        ))
      });
    }
    
    return await currentNode.save();
  }

  async reEvaluateBonusByChild(child, bonus = 1): Promise<any> {
    if (bonus > 0 && 'parent' in child && child.parent != '') {
      const node = await this.treeModel.findById(child.parent).exec();

      if (!node) return -1;

      await this.treeModel.updateOne(
        { _id: node._id },
        { $set: { bonus: node.bonus + bonus } },
      );

      if (node.parent != null) {
        return this.reEvaluateBonusByChild(node, bonus - 0.5);
      }
    }

    return null;
  }

  async reEvaluateBonusParentByMigratedChild(MigratedChild): Promise<number> {
    return 1 + (MigratedChild.children.size * 0.5);
  }

  async updateTillRoot(child: MemberDocument, flag='plus', count=1): Promise<MemberDocument> {
    if ('parent' in child) {
      const node = await this.treeModel.findById(child.parent).exec();

      if (!node) return child;
      
      node.children.set(child._id.toString(), child);
      
      if (count>0) {
        if (flag=='plus'){
          node.bonus = node.bonus + 0.5;
        }else{
          node.bonus = node.bonus - 0.5;
        }
        count--;
      }
      
      await node.save();
      return this.updateTillRoot(node, flag, count);
    }

    return child;
  }

  async updateTillRootForMigrate(child: MemberDocument, flag='plus', count=1): Promise<MemberDocument> {
    if ('parent' in child) {
      const node = await this.treeModel.findById(child.parent).exec();

      if (!node) return child;
      
      node.children.set(child._id.toString(), child);
      
      if (count>0) {
        if (flag=='plus'){
          node.bonus = node.bonus + 0.5;
        }else{
          node.bonus = node.bonus - 0.5;
        }
        count--;
      }
      
      await this.treeModel.findByIdAndUpdate(node._id.toString(), {children: node.children, bonus: node.bonus});
      return this.updateTillRoot(node, flag, count);
    }

    return child;
  }

  async aneh(): Promise<MemberDocument> {

    const node = {
      _id: new mongoose.Types.ObjectId('63c64fe41ef0c4984d7183f7'),
      value: 'Jack',
      level: 1,
      bonus: 2.5,
      parent: null,
      children: {
        '63c64fea1ef0c4984d7183fe': {
          _id: new mongoose.Types.ObjectId("63c64fea1ef0c4984d7183fe"),
          value: 'Jack child 1',
          level: 2,
          bonus: 0,
          parent: new mongoose.Types.ObjectId("63c64fe41ef0c4984d7183f7"),
          children: {},
          __v: 0
        },
        '63c64ff21ef0c4984d718408': {
          _id: new mongoose.Types.ObjectId("63c64ff21ef0c4984d718408"),
          value: 'Jack child 2',
          level: 2,
          bonus: 1,
          parent: new mongoose.Types.ObjectId("63c64fe41ef0c4984d7183f7"),
          children: {
            '63c64ff91ef0c4984d718414': {
              _id: new mongoose.Types.ObjectId("63c64ff91ef0c4984d718414"),
              value: 'Jack child 2.1',
              level: 3,
              bonus: 0,
              parent: new mongoose.Types.ObjectId("63c64ff21ef0c4984d718408"),
              children: {},
              __v: 0
            }
          },
          __v: 0
        }
      },
      __v: 0
    }
    
    const createdTree = await this.treeModel.updateOne(node);
    return
  }
}
