import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { AvatarArt } from '@/components/avatar/AvatarArt';
import { AVATARS } from '@/components/avatar/avatars';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { FormMessage, TextField } from '@/components/form/Fields';
import type { ProfileValues } from '@/features/auth/schemas';
import { profileSchema } from '@/features/auth/schemas';
import { cn } from '@/lib/cn';
import type { Profile } from '@/lib/repository/types';

interface EditProfileSheetProps {
  open: boolean;
  profile: Profile;
  onClose: () => void;
  onSave: (values: ProfileValues) => Promise<void>;
}

export function EditProfileSheet({ open, profile, onClose, onSave }: EditProfileSheetProps) {
  const titleId = useId();
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      className="max-h-[92dvh] overflow-y-auto"
    >
      {open && <EditForm titleId={titleId} profile={profile} onClose={onClose} onSave={onSave} />}
    </BottomSheet>
  );
}

function EditForm({
  titleId,
  profile,
  onClose,
  onSave,
}: Omit<EditProfileSheetProps, 'open'> & { titleId: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: profile.displayName, avatar: profile.avatar },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSave(values);
      onClose();
    } catch {
      setFormError("Couldn't save your profile. Please try again.");
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <h2 id={titleId} className="font-display text-2xl font-bold">
        Edit profile
      </h2>
      <div className="mt-5 space-y-5">
        {formError && <FormMessage>{formError}</FormMessage>}
        <Controller
          control={control}
          name="avatar"
          render={({ field }) => (
            <fieldset>
              <legend className="mb-2 font-semibold">Avatar</legend>
              <div className="grid grid-cols-4 gap-3">
                {AVATARS.map((a) => {
                  const checked = field.value === a.id;
                  return (
                    <label
                      key={a.id}
                      className={cn(
                        'relative flex cursor-pointer flex-col items-center gap-1 rounded-card p-2 text-xs font-semibold transition-colors duration-fast',
                        'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-violet',
                        checked ? 'bg-surface-2 ring-2 ring-violet' : 'hover:bg-white/5',
                      )}
                    >
                      <input
                        type="radio"
                        name={field.name}
                        value={a.id}
                        checked={checked}
                        onChange={() => field.onChange(a.id)}
                        className="sr-only"
                      />
                      <AvatarArt id={a.id} size={52} />
                      {a.name}
                      {checked && (
                        <Check
                          className="absolute right-1 top-1 h-4 w-4 rounded-full bg-violet p-0.5"
                          aria-hidden="true"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
        />
        <TextField
          label="Display name"
          autoComplete="nickname"
          maxLength={24}
          hint="A nickname, not your real name."
          error={errors.displayName?.message}
          {...register('displayName')}
        />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
