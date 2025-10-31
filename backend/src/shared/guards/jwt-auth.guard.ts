import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt'){
    //el guard extiende eñ guard predeterminado de passport, se configura como tipo de estrategia a usar el jwt
    //esto verifica si el token es valido y si es asi, lo agrega a la solicitud para que pueda ser usado en el controlador
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt'){
    handleRequest(err:any, user:any, info:any, context:ExecutionContext){
        return user || null;    
    }
}