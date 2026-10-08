import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import {
  ehAdmin,
  garantirDonoOuAdmin,
} from '../common/helpers/propriedade';
import { paraDataUtc } from '../common/helpers/data';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_USER, UsuarioAutenticado } from '../auth/tipos/usuario-autenticado';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Custo do bcrypt. Cada ponto a mais dobra o tempo de calculo.
 * 12 e o equilibrio atual entre seguranca e latencia aceitavel no login.
 */
const CUSTO_BCRYPT = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          nome: dto.nome,
          email: dto.email,
          senha: await bcrypt.hash(dto.senha, CUSTO_BCRYPT),
          dataNascimento: paraDataUtc(dto.dataNascimento),
          rg: dto.rg,
          cpf: dto.cpf,
          nomeMae: dto.nomeMae,
          // Forcado. Nunca vem do cliente (nao esta no DTO) e nunca fica a
          // cargo do banco, cujo DEFAULT e 'admin'.
          role: ROLE_USER,
        },
      });
    } catch (erro) {
      throw this.traduzirErro(erro);
    }
  }

  listar() {
    return this.prisma.user.findMany({ orderBy: { id: 'asc' } });
  }

  async buscarPorId(id: number) {
    const usuario = await this.prisma.user.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} nao encontrado`);
    }

    return usuario;
  }

  async atualizar(
    id: number,
    dto: UpdateUserDto,
    solicitante: UsuarioAutenticado,
  ) {
    garantirDonoOuAdmin(solicitante, id);

    // Um usuario comum poderia se promover a admin com um simples PUT no
    // proprio cadastro. Esta e a checagem que impede isso.
    if (dto.role !== undefined && !ehAdmin(solicitante)) {
      throw new ForbiddenException(
        'Somente um administrador pode alterar o perfil de acesso',
      );
    }

    const dados: Prisma.UserUpdateInput = {
      nome: dto.nome,
      email: dto.email,
      dataNascimento: paraDataUtc(dto.dataNascimento),
      rg: dto.rg,
      cpf: dto.cpf,
      nomeMae: dto.nomeMae,
      role: dto.role,
    };

    if (dto.senha) {
      dados.senha = await bcrypt.hash(dto.senha, CUSTO_BCRYPT);
    }

    try {
      return await this.prisma.user.update({ where: { id }, data: dados });
    } catch (erro) {
      throw this.traduzirErro(erro, id);
    }
  }

  async remover(id: number) {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (erro) {
      throw this.traduzirErro(erro, id);
    }

    // As FKs de enderecos e contatos tem ON DELETE CASCADE: eles somem junto.
    return { mensagem: `Usuario ${id} removido` };
  }

  /**
   * Unico ponto da aplicacao que le o hash da senha. O `omit: { senha: false }`
   * desliga, so para esta consulta, a omissao global configurada no
   * PrismaService.
   */
  buscarPorEmailComSenha(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      omit: { senha: false },
    });
  }

  private traduzirErro(erro: unknown, id?: number): Error {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      if (erro.code === 'P2002') {
        const campos = Array.isArray(erro.meta?.target)
          ? (erro.meta.target as string[]).join(', ')
          : 'email ou cpf';

        return new ConflictException(`Ja existe um usuario com este ${campos}`);
      }

      if (erro.code === 'P2025') {
        return new NotFoundException(`Usuario ${id} nao encontrado`);
      }
    }

    return erro instanceof Error ? erro : new Error(String(erro));
  }
}
