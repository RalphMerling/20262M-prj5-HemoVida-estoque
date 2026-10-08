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

import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../auth/tipos/usuario-autenticado';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

/**
 * Cuidado ao ler este controller: o parametro de rota muda de significado
 * conforme o metodo HTTP.
 *
 *   GET    /address/:idUser  -> id do USUARIO
 *   POST   /address/:idUser  -> id do USUARIO
 *   PUT    /address/:id      -> id do ENDERECO
 *   DELETE /address/:id      -> id do ENDERECO
 *
 * E valido em HTTP (o roteamento distingue pelo metodo), mas confunde quem le
 * depois -- por isso os nomes dos parametros sao diferentes.
 */
@ApiTags('Enderecos')
@ApiAutenticacao()
@Controller('address')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get(':idUser')
  listar(
    @Param('idUser', ParseIntPipe) idUser: number,
    @UsuarioAtual() solicitante: UsuarioAutenticado,
  ) {
    return this.addresses.listarPorUsuario(idUser, solicitante);
  }

  @Post(':idUser')
  criar(
    @Param('idUser', ParseIntPipe) idUser: number,
    @Body() dto: CreateAddressDto,
    @UsuarioAtual() solicitante: UsuarioAutenticado,
  ) {
    return this.addresses.criar(idUser, dto, solicitante);
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
    @UsuarioAtual() solicitante: UsuarioAutenticado,
  ) {
    return this.addresses.atualizar(id, dto, solicitante);
  }

  @Delete(':id')
  remover(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() solicitante: UsuarioAutenticado,
  ) {
    return this.addresses.remover(id, solicitante);
  }
}
