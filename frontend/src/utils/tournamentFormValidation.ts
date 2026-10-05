type TournamentFormValidationInput = {
  today: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  startInscriptionDate: string;
  endInscriptionDate: string;
  maxTeams: string;
};

const validateTournamentForm = ({
  today,
  name,
  description,
  startDate,
  endDate,
  startInscriptionDate,
  endInscriptionDate,
  maxTeams,
}: TournamentFormValidationInput): string | null => {
  const hasMissingRequiredField = [
    name.trim(),
    description.trim(),
    startDate,
    endDate,
    startInscriptionDate,
    endInscriptionDate,
    maxTeams,
  ].some((value) => !value);

  if (hasMissingRequiredField) {
    return 'Tous les champs sont requis.';
  }

  const hasPastDate = [
    startDate,
    endDate,
    startInscriptionDate,
    endInscriptionDate,
  ].some((dateValue) => dateValue < today);

  if (hasPastDate) {
    return 'Impossible de créer un tournoi avec des dates passées.';
  }

  const maxTeamsAsNumber = Number(maxTeams);
  if (!Number.isInteger(maxTeamsAsNumber) || maxTeamsAsNumber < 2) {
    return "Le nombre maximum d'équipes doit être un entier supérieur ou égal à 2.";
  }

  if (endDate < startDate) {
    return 'La date de fin doit être postérieure ou égale à la date de début.';
  }

  if (endInscriptionDate > startDate) {
    return 'La date limite des inscriptions doit être antérieure ou égale à la date de début du tournoi.';
  }

  if (startInscriptionDate > startDate) {
    return 'La date de début des inscriptions ne peut pas être antérieur à celle du début du tournois.';
  }

  if (startInscriptionDate > endInscriptionDate) {
    return 'La date de début des inscriptions ne peut pas être antérieur à celle de fin des inscriptions.';
  }

  return null;
};

export { validateTournamentForm };
export type { TournamentFormValidationInput };
