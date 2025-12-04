import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Si es passa un paràmetre (ex: 'email'), retornar només aquesta propietat
    if (data && user) {
      return user[data];
    }
    
    // Si no es passa paràmetre, retornar l'objecte user complet
    return user;
  },
);

