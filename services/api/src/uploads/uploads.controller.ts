import { Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadsService } from "./uploads.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("OPS", "ADMIN")
@Controller("ops/uploads")
export class UploadsController {
  constructor(private uploads: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async upload(@UploadedFile() file: any) {
    return this.uploads.createBatch(file);
  }

  @Get(":id")
  async getBatch(@Param("id") id: string) {
    return this.uploads.getBatch(id);
  }
}
