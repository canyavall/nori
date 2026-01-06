# Suil Components

<!--
Migrated from: temp-FE-Mono/technical/suil/suil-components.md
Migration date: 2025-12-08
Original category: technical/suil
New category: patterns/frontend/suil
Source repo: temp-FE-Mono
-->

# Suil - Components

Component categories and usage patterns.

## Atom Components

Basic UI elements:

```typescript
import { Typography } from '@sygnum/suil/components/atoms/Typography';
import { Button } from '@sygnum/suil/components/atoms/Button';
import { LoadingButton } from '@sygnum/suil/components/atoms/LoadingButton';
import { Numeral } from '@sygnum/suil/components/atoms/Numeral';

<Typography variant="h1">Title</Typography>
<Button variant="contained" onClick={handleClick}>Submit</Button>
<LoadingButton loading={isSubmitting}>Save</LoadingButton>
<Numeral value={1234.56} currency="CHF" variant="currency" />
```

## Molecule Components

Composed UI elements:

```typescript
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@sygnum/suil/components/molecules/Dialog';
import { Alert } from '@sygnum/suil/components/molecules/Alert';
import { SygnumLoader } from '@sygnum/suil/components/molecules/Loader/SygnumLoader';

<Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>Content</DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
  </DialogActions>
</Dialog>

<Alert severity="success">Success message</Alert>
<SygnumLoader isCentered />
```

## Form Components

```typescript
import { SuilTextField } from '@sygnum/suil/components/form/SuilTextField';
import { SuilSelect } from '@sygnum/suil/components/form/SuilSelect';

<SuilTextField
  label="Email"
  required
  error={!!errors.email}
  helperText={errors.email?.message}
/>

<SuilSelect
  label="Country"
  value={country}
  onChange={handleChange}
  options={countryOptions}
/>
```

## Organism Components

Complex UI elements:

```typescript
import { HolderSystemResponse } from '@sygnum/suil/components/organisms/HolderSystemResponse';
import { HolderSystemResponseStatus } from '@sygnum/suil/components/organisms/HolderSystemResponse/HolderSystemResponse.enum';

<HolderSystemResponse
  status={HolderSystemResponseStatus.failure}
  title="Error"
  subtitle="Please try again"
/>
```
