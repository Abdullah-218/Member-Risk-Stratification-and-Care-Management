import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import styles from './OrganizationLoginPage.module.css';

const OrganizationLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error on input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate authentication delay
    setTimeout(() => {
      // Allow any username and password
      localStorage.setItem('org_authenticated', 'true');
      localStorage.setItem('org_user', formData.username);
      navigate('/org/dashboard');
      setIsLoading(false);
    }, 1000);
  };

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <Button
          variant="ghost"
          onClick={handleBack}
          className={styles.backButton}
        >
          ← Back to Login Selection
        </Button>

        <Card className={styles.card}>
          <div className={styles.header}>
            <div className={styles.iconContainer}>
              <Building2 size={48} className={styles.icon} />
            </div>
            <h1 className={styles.title}>Organization Login</h1>
            <p className={styles.subtitle}>
              Access the Care Manager Dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.error}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={styles.input}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className={styles.spinner}></div>
              ) : (
                <>
                  <LogIn size={20} style={{ marginRight: '8px' }} />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationLoginPage;
