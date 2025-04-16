"use client";

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const FormDialog = ({
  open,
  onClose,
  title,
  onSubmit,
  isSubmitting = false,
  children,
  maxWidth = 'sm',
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  disableSubmit = false,
  fullWidth = true
}) => {
  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? null : onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          {!isSubmitting && (
            <IconButton aria-label="close" onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent dividers>
          {children}
        </DialogContent>
        <DialogActions>
          {!isSubmitting && (
            <Button onClick={onClose} color="inherit">
              {cancelLabel}
            </Button>
          )}
          <Button 
            type="submit"
            color="primary"
            variant="contained"
            disabled={isSubmitting || disableSubmit}
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormDialog;