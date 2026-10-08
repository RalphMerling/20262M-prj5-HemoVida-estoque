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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

/**
 * Mesma convencao de /address: o parametro muda de significado conforme o
 * metodo.
 *
 *   GET/POST      /contact/:idUser -> id do USUARIO
 *   PUT/DELETE    /contact/:id     -> id do CONTATO
 */
@ApiTags('Contatos')
@ApiAutenticacao()
@Controller('contact')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get(':idUser')
  listar(
    @Param('idUser', ParseIntPipe) idUser: number,
    @UsuarioAtual() solicitante: UsuarioAutenticado,
  ) {
    return this.contacts.listarPorUsuario(idUser, solicitante);
  }

  @Post(':idUser')
  criar(
    @Param('idUser', ParseIntPipe) idUser: number,
    @Body() dto: CreateContactDto,
    @UsuarioAtual() solicitante: UsuarioAutenticado,
  ) {
    return this.contacts.criar(idUser, dto, solicitante);
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactDto,
    @UsuarioAtual() solicitante: UsuarioAutenticado,
  ) {
    return this.contacts.atualizar(id, dto, solicitante);
  }

  @Delete(':id')
  remover(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() solicitante: UsuarioAutenticado,
  ) {
    return this.contacts.remover(id, solicitante);
  }
}
