"use client"
import PendingLabOrders from '@/components/PendindLabOrders'
import ProtectedLayout from '@/components/ProtectedLayout'
import React from 'react'

const page = () => {
  return (
    <ProtectedLayout allowedRoles={['RECEPTIONIST']}>
        <PendingLabOrders />
    </ProtectedLayout>
  )
}

export default page