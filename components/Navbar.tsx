'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppBar, Toolbar, Button, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, CircularProgress, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Reset loading state when the page changes
  useEffect(() => {
    setLoadingLink(null);
  }, [pathname]);

  const handleLinkClick = (href: string) => {
    setLoadingLink(href);
    router.push(href);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <AppBar position="fixed" sx={{ bgcolor: '#1976d2', boxShadow: 3, top: 0, left: 0, width: '100%', zIndex: 50 }}>
      <Toolbar sx={{ mx: 'auto', maxWidth: 1200, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleMobileMenu}
            sx={{ display: { xs: 'block', md: 'none' }, mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Image
            src="/logo.png"
            alt="Women's Birth Clinic Logo"
            width={70}
            height={70}
            style={{ objectFit: 'contain' }}
          />
           <Typography variant="h6" sx={{ ml: 2, fontWeight: 'bold', display: { xs: 'none', md: 'block' } }}>
            <Link href="/" style={{ textDecoration: 'none' }} onClick={() => handleLinkClick('/')}>
              <span style={{ color: '#E07A3F' }}>NISWA Clinic</span>
            </Link>
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 2, justifyContent: 'center' }}>
          {navItems.map((item) => (
            <Button
              key={item.href}
              color="inherit"
              onClick={() => handleLinkClick(item.href)}
              disabled={loadingLink === item.href}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {loadingLink === item.href ? (
                <CircularProgress size={16} sx={{ color: 'white' }} />
              ) : (
                item.label
              )}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          {status === 'loading' ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : session ? (
            <Button
  variant="contained"
  onClick={() => {
    handleLinkClick('/login');
    signOut({ callbackUrl: '/login' });
  }}
  disabled={loadingLink === '/login'}
  sx={{
    bgcolor: 'white',
    color: '#1976d2',
    '&:hover': { bgcolor: '#f5f5f5' },
    textTransform: 'none',
    fontSize: '0.97rem',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  }}
>
  {loadingLink === '/login' ? (
    <CircularProgress size={16} sx={{ color: '#1976d2' }} />
  ) : (
    <>
      <p>Welcome, {session.user.name}</p>
      {'Logout'}
    </>
  )}
</Button>
            
          ) : (
            <Button
              variant="contained"
              onClick={() => handleLinkClick('/login')}
              disabled={loadingLink === '/login'}
              sx={{
                bgcolor: 'white',
                color: '#1976d2',
                '&:hover': { bgcolor: '#f5f5f5' },
                textTransform: 'none',
                fontSize: '0.975rem',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {loadingLink === '/login' ? (
                <CircularProgress size={16} sx={{ color: '#1976d2' }} />
              ) : (
                'Login'
              )}
            </Button>
          )}
        </Box>

        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={toggleMobileMenu}
          sx={{ display: { xs: 'block', md: 'none' } }}
        >
          <Box
            sx={{
              width: 250,
              bgcolor: '#1976d2',
              height: '100%',
              color: 'white',
              pt: 2,
            }}
          >
            <List>
              {navItems.map((item) => (
                <ListItem key={item.href} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      handleLinkClick(item.href);
                      toggleMobileMenu();
                    }}
                    disabled={loadingLink === item.href}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    {loadingLink === item.href ? (
                      <CircularProgress size={16} sx={{ color: 'white' }} />
                    ) : (
                      <Link href={item.href} style={{ textDecoration: 'none', color: 'white', width: '100%' }}>
                        <ListItemText primary={item.label} sx={{ '& .MuiListItemText-primary': { fontWeight: 500 } }} />
                      </Link>
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
              {session && (
                <ListItem>
                  <ListItemText
                    primary={`Welcome, ${session.user?.name || 'User'}`}
                    sx={{ '& .MuiListItemText-primary': { fontWeight: 500 } }}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
}