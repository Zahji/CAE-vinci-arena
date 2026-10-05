import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Unavailability } from '../../../../types';

dayjs.extend(isBetween);

type UnavailabilityCalendarProps = {
  unavailabilities: Unavailability[];
};

/**
 * Returns true if the day falls in any unavailability period.
 * @param {Dayjs} day - the day to check
 * @param {Unavailability[]} unavailabilities - the list of unavailabilities
 * @return {boolean} whether the day is unavailable
 */
const isUnavailable = (day: Dayjs, unavailabilities: Unavailability[]) =>
  unavailabilities.some((u) =>
    day.isBetween(u.startDate, u.endDate, 'day', '[]'),
  );

/**
 * Shows a button that opens a calendar with unavailable days highlighted.
 * @param {UnavailabilityCalendarProps} props - the component props
 * @return {JSX.Element} the calendar
 */
const UnavailabilityCalendar = ({
  unavailabilities,
}: UnavailabilityCalendarProps) => {
  const [open, setOpen] = useState(false);

  /**
   * Renders a calendar day with a red background when unavailable.
   * @param {PickersDayProps<Dayjs>} props - the day props
   * @return {JSX.Element} the day cell
   */
  const renderDay = (props: PickersDayProps<Dayjs>) => {
    const { day, ...rest } = props;
    const unavailable = isUnavailable(day, unavailabilities);
    return (
      <PickersDay
        {...rest}
        day={day}
        sx={
          unavailable
            ? {
                backgroundColor: 'error.main',
                color: 'white',
                '&:hover': { backgroundColor: 'error.dark' },
              }
            : {}
        }
      />
    );
  };

  return (
    <>
      <Button variant="outlined" size="small" onClick={() => setOpen(true)}>
        Voir les indisponibilités
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          Indisponibilités
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {unavailabilities.length === 0 ? (
            <Typography color="text.secondary">
              Aucune indisponibilité enregistrée.
            </Typography>
          ) : (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar slots={{ day: renderDay }} readOnly />
            </LocalizationProvider>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UnavailabilityCalendar;
