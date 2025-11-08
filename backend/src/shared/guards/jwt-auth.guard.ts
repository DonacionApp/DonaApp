import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt'){
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err || !user) {
            throw err || new UnauthorizedException('Token inválido');
        }
        
        return user;
    }
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt'){
    handleRequest(err:any, user:any, info:any, context:ExecutionContext){
        return user || null;    
    }
}