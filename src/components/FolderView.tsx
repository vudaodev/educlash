import { Skeleton } from '@/components/ui/skeleton';
import { useMaterials } from '@/hooks/useMaterials';
import { useFolders } from '@/hooks/useFolders';
import { MaterialList, type MaterialItem } from './MaterialList';

export function FolderView() {
  const { data: materials, isLoading: materialsLoading } = useMaterials();
  const { data: folders, isLoading: foldersLoading } = useFolders();

  if (materialsLoading || foldersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32 animate-pulse" />
        <Skeleton className="h-24 w-full animate-pulse" />
        <Skeleton className="h-6 w-32 animate-pulse" />
        <Skeleton className="h-24 w-full animate-pulse" />
      </div>
    );
  }

  const allMaterials = (materials ?? []) as unknown as (MaterialItem & { folder_id?: string | null })[];
  const allFolders = folders ?? [];

  const uncategorised = allMaterials.filter((m) => !m.folder_id);
  const folderGroups = allFolders.map((folder) => ({
    folder,
    materials: allMaterials.filter((m) => m.folder_id === folder.id),
  }));

  if (allMaterials.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Upload your first slides to get started!
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {folderGroups.map(({ folder, materials: folderMaterials }) => (
        <section key={folder.id}>
          <h2 className="text-lg font-semibold mb-2">{folder.name}</h2>
          <MaterialList materials={folderMaterials} />
        </section>
      ))}
      {uncategorised.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Uncategorised</h2>
          <MaterialList materials={uncategorised} />
        </section>
      )}
    </div>
  );
}
