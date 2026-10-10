import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiAutenticacao } from '../common/decorators/api-autenticacao.decorator';

import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import {
  ROLE_ADMIN,
  UsuarioAutenticado,
} from '../auth/tipos/usuario-autenticado';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Usuarios')
@ApiAutenticacao()
@Controller('user')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Aberta. A senha nao aparece: a omissao e global no PrismaService. */
  // @Public()
  @Get()
  listar() {
    return this.users.listar();
  }

  // @Public()
  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.users.buscarPorId(id);
  }

  /** Aberta: e o cadastro. O perfil sai sempre como "user". */
  // @Public()
  @Post()
  criar(@Body() dto: CreateUserDto) {
    return this.users.criar(dto);
  }

  /**
   * Admin ou o proprio usuario. Quem decide e o service, via
   * garantirDonoOuAdmin -- um guard nao daria conta porque a regra depende de
   * comparar o :id da rota com o sub do token.
   */
  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @UsuarioAtual() solicitante: UsuarioAutenticado,
  ) {
    return this.users.atualizar(id, dto, solicitante);
  }

  /** Somente admin. Como depende so do papel, o RolesGuard resolve. */
  @Roles(ROLE_ADMIN)
  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.users.remover(id);
  }
}
