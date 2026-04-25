import { useState } from "react";
import { UserPlus, Check } from "lucide-react";
import { patientsStore } from "@/lib/patients-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function NewPatientDialog({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setDateOfBirth("");
    setSuccess(false);
  };

  const submit = () => {
    if (!fullName.trim() || !dateOfBirth) return;
    
    const newPatient = patientsStore.add({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      date_of_birth: dateOfBirth,
    });
    
    setSuccess(true);
    if (onSuccess) {
      onSuccess(newPatient.id);
    }
    
    window.setTimeout(() => {
      setOpen(false);
      reset();
    }, 700);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          Novo Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Paciente</DialogTitle>
          <DialogDescription>
            Adicione um novo paciente à clínica para realizar agendamentos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Nome Completo</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: João da Silva"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Data de Nascimento</Label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Telefone</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">E-mail (opcional)</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@exemplo.com"
            />
          </div>

          {success && (
            <div className="flex items-center gap-2 rounded-md border border-[oklch(0.85_0.08_160)] bg-[oklch(0.96_0.04_160)] px-3 py-2 text-sm text-[oklch(0.4_0.13_160)]">
              <Check className="h-4 w-4" />
              Paciente cadastrado com sucesso.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!fullName.trim() || !dateOfBirth}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
