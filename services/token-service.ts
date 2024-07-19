import jwt, { JwtPayload } from "jsonwebtoken";
import { prismaClient } from "../server";

class TokenService {
  generateTokens(payload: JwtPayload) {
    const secretAccess = process.env.JWT_SECRET_ACCESS as string;
    const secretRefresh = process.env.JWT_SECRET_REFRESH as string;

    const accessToken = jwt.sign(payload, secretAccess, { expiresIn: "30s" });
    const refreshToken = jwt.sign(payload, secretRefresh, { expiresIn: "30d" });

    return {
      accessToken,
      refreshToken,
    };
  }

  async saveToken(userId: number, refreshToken: string) {
    const tokenData = await prismaClient.token.findFirst({
      where: {
        userId: userId,
      },
    });

    if (tokenData) {
      tokenData.refreshToken = refreshToken;
      return prismaClient.token.update({
        where: {
          id: tokenData.id,
        },
        data: {
          refreshToken: refreshToken,
        },
      });
    }

    const token = await prismaClient.token.create({
      data: {
        userId: userId,
        refreshToken: refreshToken,
      },
    });

    return token;
  }

  validateAccessToken(token: string) {
    try {
      const userData = jwt.verify(
        token,
        process.env.JWT_SECRET_ACCESS as string
      );
      return userData;
    } catch (error) {
      return null;
    }
  }

  validateRefreshToken(token: string) {
    try {
      const userData = jwt.verify(
        token,
        process.env.JWT_SECRET_REFRESH as string
      );
      return userData;
    } catch (error) {
      return null;
    }
  }

  async findRefreshToken(refreshToken: string) {
    const tokenData = await prismaClient.token.findUnique({
      where: {
        refreshToken: refreshToken,
      },
    });

    return tokenData;
  }
}

export default new TokenService();
