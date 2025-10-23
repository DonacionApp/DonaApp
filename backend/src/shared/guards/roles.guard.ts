import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";


@Injectable()
export class RolesGuard implements CanActivate{
    constructor(private reflector: Reflector){}//injeccion de un reflector para leer los metadatos de las rutas

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<String[]>('roles', context.getHandler());//obtener los roles requeridos de la ruta
        if(!requiredRoles){
            return true;
        }

        const {user}=context.switchToHttp().getRequest();//obtener el usuario de la peticion
        if(!requiredRoles.includes(user.rol)){
            throw new ForbiddenException('no tienes permiso para acceder a este recurso')
        }
        return true;
    }
}