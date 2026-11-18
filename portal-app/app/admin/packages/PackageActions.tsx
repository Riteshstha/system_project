'use client';

export function ModalTrigger({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        e.preventDefault();
        document.getElementById(id)?.classList.remove('hidden');
      }}
    >
      {children}
    </button>
  );
}

export function ModalCloseButton({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        document.getElementById(id)?.classList.add('hidden');
      }}
    >
      {children}
    </button>
  );
}

export function EditPackageButton({ className }: { className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => { e.preventDefault(); alert('Edit modal coming soon'); }}
    >
      Edit
    </button>
  );
}

export function ToggleActiveButton({ active, className }: { active: boolean; className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => { e.preventDefault(); alert('Toggle active status'); }}
    >
      {active ? 'Deactivate' : 'Activate'}
    </button>
  );
}