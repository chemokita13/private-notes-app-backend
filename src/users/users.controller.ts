import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.interface';
import { Request, Response } from 'express';
const jwt = require('jsonwebtoken');
import { serialize } from 'Cookie';
import { UserDTO } from './userDTO';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/get')
  getUsers(): Promise<User[]> {
    return this.usersService.getUsers();
  }
  @Post('/new')
  createUser(@Req() request: Request): Promise<User> {
    return this.usersService.createUser(request.body);
  }
  @Post('/auth')
  async authUser(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<any> {
    const returner: {
      code: number;
      msg: string;
      user: UserDTO | User;
    } = await this.usersService.authUser(request.body);

    if (returner.code !== 201) {
      return response.status(returner.code).json(returner);
    }
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 1, // valid for 1 day
        user: returner.user,
      },
      'hard_secret',
    );
    const serializedToken = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV == 'production',
      //? sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day
      path: '/',
    });
    response.setHeader('Set-Cookie', serializedToken);
    response.json({ login: true });
  }
}
