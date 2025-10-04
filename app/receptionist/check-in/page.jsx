"use client"
import React from 'react'
import TodayRegistrations from '@/components/TodayRegistrations'
import ProtectedLayout from '@/components/ProtectedLayout'
const page = () => {
  return (
    <ProtectedLayout allowedRoles={['RECEPTIONIST']}>
        <div style={{ paddingTop: '64px' }}>
      <TodayRegistrations/>
      </div>
      </ProtectedLayout>
  )
}

export default page