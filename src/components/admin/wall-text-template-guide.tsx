import { adminAsideClass, adminHintClass } from "@/components/admin/admin-form-classes";

export function WallTextTemplateGuide() {
  return (
    <div className={`${adminAsideClass} text-stone-400`}>
      <p className="font-bold text-stone-50">Cómo enriquecer al curador</p>
      <p className={`mt-2 ${adminHintClass}`}>
        El curador solo usa lo que escribes. Cuanto más claro, menos inventará.
      </p>

      <ul className="mt-4 space-y-3 text-xs leading-relaxed">
        <li>
          <strong className="text-stone-200">Marco y práctica</strong> — Dónde
          encaja la pieza en Flavor User (Day X/30), qué atmósfera tiene y con
          qué otras obras tuyas dialoga. Referencias solo si las pones tú.
        </li>
        <li>
          <strong className="text-stone-200">Texto de sala</strong> — Lo
          principal. Qué hay ante ti, cómo se hizo, cómo se vive en el espacio.
          Escribe con tu voz; puede ser largo.
        </li>
        <li>
          <strong className="text-stone-200">Descripción corta</strong> — Dos o
          tres líneas: material, medida y una frase de lo que hace en la sala.
        </li>
        <li>
          <strong className="text-stone-200">Etiquetas y conceptos</strong> —
          Palabras clave que conectan esta obra con otras en las conversaciones.
        </li>
      </ul>

      <p className={`mt-4 ${adminHintClass}`}>
        La <strong className="text-stone-300">línea de trabajo</strong> general
        del curador se edita en el panel admin principal.
      </p>
    </div>
  );
}
