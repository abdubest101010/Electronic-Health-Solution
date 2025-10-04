'use client'
import React from 'react'
import RegistrationForms from '@/components/RegistrationForms'
import ProtectedLayout from '@/components/ProtectedLayout'

const page = () => {
  return (
    <ProtectedLayout allowedRoles={['RECEPTIONIST']}>
      <div style={{ paddingTop: '64px' }}>
        <RegistrationForms/>
      </div>
    </ProtectedLayout>
  )
}

export default page