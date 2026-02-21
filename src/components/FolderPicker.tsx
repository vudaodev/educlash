import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useFolders } from '@/hooks/useFolders';

interface Props {
  materialId: string;
  currentFolderId: string | null;
  onSelect: (folderId: string | null) => void;
}

export function FolderPicker({ currentFolderId, onSelect }: Props) {
  const { data: folders, isLoading } = useFolders();

  const currentFolder = folders?.find((f) => f.id === currentFolderId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {currentFolder?.name ?? 'Uncategorised'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onSelect(null)}>
          Uncategorised
        </DropdownMenuItem>
        {!isLoading &&
          folders?.map((folder) => (
            <DropdownMenuItem
              key={folder.id}
              onClick={() => onSelect(folder.id)}
            >
              {folder.name}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
