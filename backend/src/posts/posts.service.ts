import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FindPostDto } from './dto/find-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(
    user: User,
    createPostDto: CreatePostDto,
    file: Express.Multer.File,
  ) {
    const {
      title,
      type,
      metaData,
      tags,
      content,
      name,
      quality,
      watchTime,
      year,
      categories: categoriesString,
    } = createPostDto;

    const postContent = JSON.parse(content);

    return await this.prisma.post.create({
      data: {
        title,
        type,
        image: file.filename,
        metaData,
        tags,
        content: postContent,
        name,
        quality,
        watchTime,
        year,
        categories: {
          connect: JSON.parse(categoriesString).map((category: number) => ({
            id: category,
          })),
        },
        createdBy: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          select: {
            parentId: true,
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  findAll(findPostDto: FindPostDto) {
    const { searchTerm, order, page, limit, category, categoryExact } =
      findPostDto;

    const skip = page ? (Number(page) - 1) * Number(limit) : 0;
    const take = limit ? Number(limit) : 10;

    const orderBy = {
      createdAt: order,
    };

    const include = {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      categories: {
        select: {
          parentId: true,
          id: true,
          name: true,
          type: true,
        },
      },
    };

    const search = [
      {
        title: {
          contains: searchTerm,
        },
      },
      {
        metaData: {
          contains: searchTerm,
        },
      },
      {
        tags: {
          contains: searchTerm,
        },
      },
      {
        name: {
          contains: searchTerm,
        },
      },
    ];

    const categoryExactFilter = categoryExact
      ? categoryExact.split(',').map((category: string) => ({
          categories: {
            some: {
              id: Number(category),
            },
          },
        }))
      : undefined;

    const categoryFilter = category
      ? category.split(',').map((category: string) => ({
          categories: {
            some: {
              id: Number(category),
            },
          },
        }))
      : undefined;

    const whereOr = [];

    if (searchTerm) {
      whereOr.push(...search);
    }

    if (categoryFilter) {
      whereOr.push(...categoryFilter);
    }

    const where = {
      OR: whereOr.length > 0 ? whereOr : undefined,
      AND: categoryExactFilter,
    };
    console.log(where);

    return this.prisma.post.findMany({
      where,
      include,
      orderBy,
      skip,
      take,
    });
  }

  findOne(id: number) {
    const post = this.prisma.post.findUnique({
      where: {
        id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          select: {
            parentId: true,
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return post;
  }

  update(id: number, updatePostDto: UpdatePostDto, file: Express.Multer.File) {
    const {
      title,
      type,
      metaData,
      tags,
      content,
      name,
      quality,
      watchTime,
      year,
      categories: categoriesString,
    } = updatePostDto;
    return this.prisma.post.update({
      where: {
        id,
      },
      data: {
        title,
        type,
        metaData,
        tags,
        content,
        image: file && file.filename,
        name,
        quality,
        watchTime,
        year,
        categories: {
          connect: JSON.parse(categoriesString).map((category: number) => ({
            id: category,
          })),
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          select: {
            parentId: true,
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.prisma.post.delete({
      where: {
        id,
      },
    });

    return 'Post deleted successfully';
  }
}
