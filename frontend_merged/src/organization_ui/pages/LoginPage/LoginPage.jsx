import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ChevronRight } from "lucide-react";

// context (same organizational_login module)
import { useAuth } from "../../context/AuthContext";

// common components
import Card from "../../components/common/Card/Card";
import Input from "../../components/common/Input/Input";
import Button from "../../components/common/Button/Button";

// styles
import styles from "./LoginPage.module.css";


const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username && password) {
      login({ name: username, role: 'admin' });
      navigate('/dashboard');
    }
  };

  const handleIndividualAssessment = () => {
    navigate('/individual-assessment');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Activity className={styles.logo} />
          <h1 className={styles.title}>HealthGuard AI</h1>
          <p className={styles.subtitle}>Risk Stratification Platform</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <h2 className={styles.formTitle}>Organization Login</h2>

          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />

          <Button variant="primary" type="submit" fullWidth>
            Login
          </Button>
        </form>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <Button 
          variant="secondary" 
          fullWidth
          onClick={handleIndividualAssessment}
        >
          Individual Assessment <ChevronRight size={16} />
        </Button>
      </Card>
    </div>
  );
};

export default LoginPage;