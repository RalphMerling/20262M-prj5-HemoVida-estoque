import { Injectable, NotFoundException } from '@nestjs/common';

import { garantirDonoOuAdmin } from '../common/helpers/propriedade';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../auth/tipos/usuario-autenticado';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /address/:idUser -- o id da rota e o do USUARIO. */
  listarPorUsuario(idUsuario: number, solicitante: UsuarioAutenticado) {
    garantirDonoOuAdmin(solicitante, idUsuario);

    return this.prisma.address.findMany({
      where: { idUsuario },
      orderBy: { id: 'asc' },
    });
  }

  /** POST /address/:idUser -- idem: o id da rota e o do USUARIO. */
  async criar(
    idUsuario: number,
    dto: CreateAddressDto,
    solicitante: UsuarioAutenticado,
  ) {
    garantirDonoOuAdmin(solicitante, idUsuario);

    try {
      return await this.prisma.address.create({
        data: { ...dto, idUsuario },
      });
    } catch (erro) {
      // P2003 = violacao de chave estrangeira, ou seja, o usuario nao existe.
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2003'
      ) {
        throw new NotFoundException(`Usuario ${idUsuario} nao encontrado`);
      }
      throw erro;
    }
  }

  /**
   * PUT /address/:id -- atencao: aqui o id da rota e o do ENDERECO.
   *
   * Por isso a checagem de propriedade so acontece DEPOIS de carregar o
   * registro: e ele quem diz de quem o endereco e.
   */
  async atualizar(
    id: number,
    dto: UpdateAddressDto,
    solicitante: UsuarioAutenticado,
  ) {
    const endereco = await this.buscarOuFalhar(id);

    garantirDonoOuAdmin(solicitante, endereco.idUsuario);

    return this.prisma.address.update({ where: { id }, data: dto });
  }

  /** DELETE /address/:id -- o id da rota e o do ENDERECO. */
  async remover(id: number, solicitante: UsuarioAutenticado) {
    const endereco = await this.buscarOuFalhar(id);

    garantirDonoOuAdmin(solicitante, endereco.idUsuario);

    await this.prisma.address.delete({ where: { id } });

    return { mensagem: `Endereco ${id} removido` };
  }

  private async buscarOuFalhar(id: number) {
    const endereco = await this.prisma.address.findUnique({ where: { id } });

    if (!endereco) {
      throw new NotFoundException(`Endereco ${id} nao encontrado`);
    }

    return endereco;
  }
}
