import { JsonParserApp } from '@/components/JsonParserApp';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div>
      <main className="bg-background min-h-screen">
        <JsonParserApp />
      </main>
    </div>
  );
}
