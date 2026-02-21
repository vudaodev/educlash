import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface MaterialItem {
  id: string;
  title: string;
  type: string;
  created_at: string;
  [key: string]: unknown;
}

interface Props {
  materials: MaterialItem[];
}

export function MaterialList({ materials }: Props) {
  if (materials.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No materials</p>;
  }

  return (
    <div className="space-y-3">
      {materials.map((m) => (
        <Card key={m.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{m.title}</CardTitle>
              <Badge variant="secondary">{m.type}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {new Date(m.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
