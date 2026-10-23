import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const PublicRoute = (): CustomDecorator<string> => SetMetadata(IS_PUBLIC_KEY, true);
