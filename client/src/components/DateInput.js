import React, { useState, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Popover,
  Box,
  Typography,
  Grid,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

function DateInput({ value, onChange, label, placeholder, fullWidth = true, sx = {} }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Update current month when value changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value]);

  const handleCalendarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDateSelect = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    onChange({ target: { value: formattedDate } });
    handleClose();
  };

  const handleMonthChange = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'next') {
        newMonth.setMonth(newMonth.getMonth() + 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() - 1);
      }
      return newMonth;
    });
  };

  const open = Boolean(anchorEl);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const days = [];

    // Add previous month's days to fill first week
    // Sunday = 0, Monday = 1, etc.
    const firstDayOfWeek = firstDay.getDay();
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(firstDay);
      prevDate.setDate(prevDate.getDate() - (firstDayOfWeek - i));
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(firstDay);
      date.setDate(i);
      days.push({ date, isCurrentMonth: true });
    }

    // Add next month's days to fill last week
    // Ensure we always have 6 rows (42 days total) for consistent layout
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(lastDay);
      nextDate.setDate(lastDay.getDate() + i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();

  return (
    <>
      <TextField
        fullWidth={fullWidth}
        type="date"
        label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        variant="outlined"
        inputProps={{
          'aria-label': 'Select date',
          style: { 
            fontSize: isMobile ? '18px' : '16px',
            padding: isMobile ? '20px 16px' : '16px 14px',
            minHeight: isMobile ? '64px' : '56px'
          }
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleCalendarClick}
                edge="end"
                aria-label="Open calendar"
                sx={{
                  padding: isMobile ? '12px' : '8px',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  }
                }}
              >
                <CalendarIcon sx={{ fontSize: isMobile ? '24px' : '20px' }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          ...sx,
          '& .MuiInputBase-input': {
            fontSize: isMobile ? '18px' : '16px',
            '&::-webkit-datetime-edit': {
              padding: '0',
            },
            '&::-webkit-datetime-edit-fields-wrapper': {
              padding: '0',
            },
            '&::-webkit-datetime-edit-text': {
              padding: '0 2px',
            },
            '&::-webkit-datetime-edit-month-field': {
              padding: '0 2px',
            },
            '&::-webkit-datetime-edit-day-field': {
              padding: '0 2px',
            },
            '&::-webkit-datetime-edit-year-field': {
              padding: '0 2px',
            },
            '&::-webkit-calendar-picker-indicator': {
              cursor: 'pointer',
              padding: isMobile ? '8px' : '4px',
              transform: isMobile ? 'scale(1.2)' : 'scale(1)',
            }
          }
        }}
      />
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isMobile ? 'center' : 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isMobile ? 'center' : 'left',
        }}
        PaperProps={{
          sx: {
            p: isMobile ? 3 : 2,
            minWidth: isMobile ? '90vw' : 280,
            maxWidth: isMobile ? '90vw' : 320,
            maxHeight: isMobile ? '80vh' : 'auto',
            overflow: 'auto',
            borderRadius: isMobile ? '12px' : '8px',
            boxShadow: isMobile ? '0 8px 32px rgba(0,0,0,0.12)' : '0 4px 20px rgba(0,0,0,0.15)',
          }
        }}
      >
        <Box>
          {/* Month navigation header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: isMobile ? 3 : 2 
          }}>
            <IconButton
              onClick={() => handleMonthChange('prev')}
              aria-label="Previous month"
              sx={{
                padding: isMobile ? '12px' : '8px',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                }
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: isMobile ? '24px' : '20px' }} />
            </IconButton>
            
            <Typography 
              variant={isMobile ? "h5" : "h6"} 
              sx={{ 
                fontWeight: 'bold',
                textAlign: 'center',
                flex: 1
              }}
            >
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
            
            <IconButton
              onClick={() => handleMonthChange('next')}
              aria-label="Next month"
              sx={{
                padding: isMobile ? '12px' : '8px',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                }
              }}
            >
              <ChevronRightIcon sx={{ fontSize: isMobile ? '24px' : '20px' }} />
            </IconButton>
          </Box>
          
          <Box sx={{ width: '100%' }}>
            {/* Day headers */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: isMobile ? 1.5 : 1,
              mb: 1
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <Typography 
                  key={day}
                  variant={isMobile ? "body2" : "caption"} 
                  align="center" 
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: isMobile ? '14px' : '12px',
                    color: 'text.secondary',
                    py: isMobile ? 1 : 0.5
                  }}
                >
                  {day}
                </Typography>
              ))}
            </Box>
            
            {/* Calendar days */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: isMobile ? 1.5 : 1
            }}>
              {calendarDays.map(({ date, isCurrentMonth }, index) => {
                const isToday = date.toDateString() === today.toDateString();
                const isSelected = date.toISOString().split('T')[0] === value;
                
                return (
                  <Button
                    key={index}
                    size="small"
                    onClick={() => handleDateSelect(date)}
                    sx={{
                      minWidth: 'auto',
                      width: '100%',
                      p: isMobile ? 1.5 : 0.5,
                      minHeight: isMobile ? '48px' : '32px',
                      color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                      backgroundColor: isSelected ? 'primary.main' : 'transparent',
                      '&:hover': {
                        backgroundColor: isSelected ? 'primary.dark' : 'action.hover',
                      },
                      fontWeight: isToday ? 'bold' : 'normal',
                      border: isToday ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                      borderRadius: isMobile ? '8px' : '4px',
                      fontSize: isMobile ? '16px' : '14px',
                      '&:active': {
                        transform: isMobile ? 'scale(0.95)' : 'none',
                      }
                    }}
                  >
                    {date.getDate()}
                  </Button>
                );
              })}
            </Box>
          </Box>
          
          {/* Mobile close button */}
          {isMobile && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleClose}
                sx={{
                  minWidth: '120px',
                  py: 1.5,
                  px: 3,
                  fontSize: '16px',
                  borderRadius: '8px',
                  textTransform: 'none'
                }}
              >
                Close
              </Button>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
}

export default DateInput; 