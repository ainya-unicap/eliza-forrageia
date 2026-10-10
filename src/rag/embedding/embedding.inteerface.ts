export interface Embedding {
    generate(text: string): Promise<number[]>
}