// Declaraciones de tipo para módulos ES
declare module '*.ts' {
  const content: any;
  export default content;
}

declare module '*.tsx' {
  const content: any;
  export default content;
}

// Para react-navigation
declare module '@react-navigation/native' {
  export * from '@react-navigation/native/lib/typescript/src';
}

declare module '@react-navigation/stack' {
  export * from '@react-navigation/stack/lib/typescript/src';
}