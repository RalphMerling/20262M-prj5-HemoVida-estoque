import { Injectable, NotFoundException } from '@nestjs/common';

import { garantirDonoOuAdmin } from '../common/helpers/propriedade';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../auth/tipos/usuario-autenticado';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /contact/:idUser -- id do USUARIO. */
  listarPorUsuario(idUsuario: number, solicitante: UsuarioAutenticado) {
    garantirDonoOuAdmin(solicitante, idUsuario);

    return this.prisma.contact.findMany({
      where: { idUsuario },
      orderBy: { id: 'asc' },
    });
  }

  /** POST /contact/:idUser -- id do USUARIO. */
  async criar(
    idUsuario: number,
    dto: CreateContactDto,
    solicitante: UsuarioAutenticado,
  ) {
    garantirDonoOuAdmin(solicitante, idUsuario);

    try {
      return await this.prisma.contact.create({
        data: { ...dto, idUsuario },
      });
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2003'
      ) {
        throw new NotFoundException(`Usuario ${idUsuario} nao encontrado`);
      }
      throw erro;
    }
  }

  /** PUT /contact/:id -- aqui o id e do CONTATO. */
  async atualizar(
    id: number,
    dto: UpdateContactDto,
    solicitante: UsuarioAutenticado,
  ) {
    const contato = await this.buscarOuFalhar(id);

    garantirDonoOuAdmin(solicitante, contato.idUsuario);

    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  /** DELETE /contact/:id -- id do CONTATO. */
  async remover(id: number, solicitante: UsuarioAutenticado) {
    const contato = await this.buscarOuFalhar(id);

    garantirDonoOuAdmin(solicitante, contato.idUsuario);

    await this.prisma.contact.delete({ where: { id } });

    return { mensagem: `Contato ${id} removido` };
  }

  private async buscarOuFalhar(id: number) {
    const contato = await this.prisma.contact.findUnique({ where: { id } });

    if (!contato) {
      throw new NotFoundException(`Contato ${id} nao encontrado`);
    }

    return contato;
  }
}
