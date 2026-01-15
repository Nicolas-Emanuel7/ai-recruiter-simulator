# Frontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.11.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Deploy no Firebase Hosting

Este projeto está configurado para deploy no Firebase Hosting. Para instruções detalhadas, consulte [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md).

### Resumo rápido:

1. **Instale o Firebase CLI** (se ainda não tiver):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login no Firebase**:
   ```bash
   firebase login
   ```

3. **Configure o projeto Firebase**:
   - Edite `src/environments/environment.prod.ts` e defina a URL do backend
   - Crie `.firebaserc` baseado em `.firebaserc.example` com o ID do seu projeto

4. **Build e Deploy**:
   ```bash
   npm run deploy
   ```
   
   Ou manualmente:
   ```bash
   npm run build:prod
   firebase deploy --only hosting
   ```

⚠️ **Importante**: Antes do deploy, atualize a `apiUrl` no arquivo `src/environments/environment.prod.ts` com a URL real do seu backend.

## Configuração da API URL

O frontend precisa conhecer a URL do backend em produção:

- **Desenvolvimento**: Usa `src/environments/environment.ts` (localhost:3000)
- **Produção**: Usa `src/environments/environment.prod.ts` (URL do backend em produção)

**Antes de cada build de produção**, edite `src/environments/environment.prod.ts` e atualize a `apiUrl` com a URL do seu backend.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
