import { useEffect, useState } from "react";
import api from "@/lib/apiClient";
import { Users } from "@phosphor-icons/react";

export default function Team() {
  const [members, setMembers] = useState([]);
  useEffect(() => {
    // For now we only have current company's users via signup. Placeholder list.
    setMembers([]);
  }, []);
  return (
    <div className="p-6 space-y-4 fade-up">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pessoas</div>
        <h1 className="font-display text-3xl font-bold tracking-tight mt-1">Equipe</h1>
      </div>
      <div className="border border-dashed border-border rounded-md p-12 text-center text-muted-foreground" data-testid="team-empty">
        <Users size={32} weight="duotone" className="mx-auto mb-3 text-[#D94A38]" />
        <p className="text-sm">Gerencie convites, perfis e permissões da equipe.</p>
        <p className="text-xs mt-1">Em breve: convidar por e-mail, atribuir perfis (CEO, Gestor, Atendimento, etc.)</p>
      </div>
    </div>
  );
}
