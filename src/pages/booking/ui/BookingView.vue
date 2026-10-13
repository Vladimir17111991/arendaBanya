<template>
  <BookingForm
    :initial="bookingPrefill"
    @back="navigate(isAdmin ? 'cabinet' : 'price')"
    @show="showBooking"
  />
</template>

<script setup lang="ts">
import { BookingForm } from '../../../features/book-appointment/index.ts';
import { usePractice, type Booking } from '../../../entities/practice/index.ts';
import { useNavigation } from '../../../shared/routing/index.ts';

const { isAdmin, focusBooking } = usePractice();
const { navigate, bookingPrefill } = useNavigation();
function showBooking(booking: Booking) {
  focusBooking(booking);
  navigate('cabinet', { tab: 'overview' });
}
</script>
