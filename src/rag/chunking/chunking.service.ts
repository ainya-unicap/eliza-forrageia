import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkingService {
        chunk(
        text: string,
        chunkSize = 500,
        overlap = 100
    ): string[] {
        const chunks: string[] = [];
        let start = 0;
        
        while( start < text.length ) {
            const end = start + chunkSize;

            chunks.push(
                text.slice(start, end),
            );
            start += chunkSize - overlap;
        }

        return chunks;
    }
}
