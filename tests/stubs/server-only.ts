// Substituto de `server-only` nos testes.
//
// O pacote real existe para o compilador do Next recusar um import de módulo
// de servidor dentro de código de cliente -- em tempo de teste (Node puro) ele
// simplesmente lança na importação. Este arquivo vazio ocupa o lugar dele via
// alias no vitest.config.ts, sem afetar o build de produção.
export {};
