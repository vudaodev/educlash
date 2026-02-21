# Skill: new-modal

Generate a modal/dialog component with form validation.

## Usage

```
/new-modal <modal-name>
```

Example: `/new-modal upload-material`, `/new-modal create-team`, `/new-modal join-challenge`

## Instructions

1. Create a file at `src/components/<ModalName>Modal.tsx` (PascalCase, suffixed with `Modal`).

2. Use this template:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const <modalName>Schema = z.object({
  // TODO: define form fields
  name: z.string().min(1, 'Required'),
});

type <ModalName>FormValues = z.infer<typeof <modalName>Schema>;

interface <ModalName>ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function <ModalName>Modal({ open, onOpenChange }: <ModalName>ModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<<ModalName>FormValues>({
    resolver: zodResolver(<modalName>Schema),
  });

  async function onSubmit(values: <ModalName>FormValues) {
    // TODO: call mutation hook
    console.log(values);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle><Modal Title></DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

3. The modal is controlled by the parent component via `open` and `onOpenChange` props. Example usage in a parent:

```tsx
const [open, setOpen] = useState(false);
// ...
<Button onClick={() => setOpen(true)}>Open</Button>
<<ModalName>Modal open={open} onOpenChange={setOpen} />
```

4. Replace TODO comments with actual form fields and mutation calls.

5. If the modal needs to edit an existing entity, add an optional `defaultValues` prop and call `reset(defaultValues)` in a `useEffect`.

## Conventions

- Always use React Hook Form + Zod for form validation
- `max-w-sm` on `DialogContent` keeps modals mobile-friendly
- Use only shadcn/ui form components (`Input`, `Select`, `Textarea`, etc.)
- Named exports (not default) for modal components
- Reset form on successful submit and close the dialog
- Show inline validation errors below each field
- Disable submit button while `isSubmitting`
