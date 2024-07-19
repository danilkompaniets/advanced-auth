import { v4 as uuidv4 } from "uuid";
import { prismaClient } from "../server";
import * as bcrypt from "bcrypt";
import mailService from "./mail-service";
import tokenService from "./token-service";
import UserDto from "../dtos/user-dto";
import ApiError from "../exceptions/api-error";
import { User } from "@prisma/client";

class UserService {
  async registration(email: string, password: string) {
    const candidate = await prismaClient.user.findFirst({
      where: { email: email },
    });

    if (candidate) {
      throw ApiError.BadRequest("User alredy exists");
    }

    const hashedPassword = await bcrypt.hash(password, 3);

    const activationLink = uuidv4();

    const user = await prismaClient.user.create({
      data: {
        email: email,
        password: hashedPassword,
        activationLink: activationLink,
      },
    });

    await mailService.sendActivationMail(
      email,
      `${process.env.API_URL}api/activate/${activationLink}`
    );

    const userDto = new UserDto(user);

    const tokens = tokenService.generateTokens({ ...userDto });

    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: UserDto,
    };
  }

  async activate(activationLink: string) {
    const user = await prismaClient.user.update({
      where: {
        activationLink: activationLink,
      },
      data: {
        isActivated: true,
      },
    });

    if (!user) {
      throw ApiError.BadRequest("Incorrect activation link");
    }
  }

  async login(email: string, password: string) {
    const user = await prismaClient.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      throw ApiError.BadRequest("user with this email doesn't exists");
    }

    const isPassEqual = await bcrypt.compare(password, user.password);

    if (!isPassEqual) {
      throw ApiError.BadRequest("Password incorrect");
    }

    const userDto = new UserDto(user);

    const tokens = tokenService.generateTokens({ ...userDto });

    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: UserDto,
    };
  }

  async logout(refreshToken: string) {
    const token = await prismaClient.token.delete({
      where: {
        refreshToken: refreshToken,
      },
    });
  }

  async refresh(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw ApiError.UnauthorizedError();
      }

      const userData = tokenService.validateRefreshToken(refreshToken) as User;
      const tokenFromDb = await tokenService.findRefreshToken(refreshToken);

      if (!userData || !tokenFromDb) {
        throw ApiError.UnauthorizedError();
      }

      const user = await prismaClient.user.findUnique({
        where: {
          id: userData.id,
        },
      });

      const userDto = new UserDto(userData as User);

      const tokens = tokenService.generateTokens({ ...userDto });

      await tokenService.saveToken(userDto.id, tokens.refreshToken);

      return {
        ...tokens,
        user: UserDto,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async getAllUsers() {
    const users = await prismaClient.user.findMany();
    return users;
  }
}

export default new UserService();
