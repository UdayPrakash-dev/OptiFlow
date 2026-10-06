import React,{useEffect, useState} from 'react';
// Done by Uday Prakash 
// Endpoints: GET /api/companies

import {
  Plus,
  Search,
  Eye,
  Edit3,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';

import { apiClient } from '../../../services/api/client';
import { Table } from '../../../shared/components/Table';
import { Modal} from '../../../shared/components/Modal';
import { FormField,Input,Select} from '../../../shared/components/FormField';
import styles from './Companies.module.css';
import { Badge } from '../../../shared/components/Badge';
import { useApi } from '../../../hooks/useApi';


const fetchCompaniesApi = ()=>{
  return apiClient('/platform/companies');
};




function PlatformCompanies() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const getBadgeStatus = (status) => {
  if (status === 'Active') return 'success';
  if (status === 'Suspended') return 'warning';
  if (status === 'Closed') return 'danger';
  return 'default';
  };

  const { data: companiesList, loading, error } = 
  useApi(fetchCompaniesApi);


  
  const columns = [
    {
      header:'Company',
      accessor: 'legalName',
      render: (row) =>{
        const users = row.userCount ?? row._count?.users ?? 0;
        const branches = row.branchCount ?? row._count?.branches??0;



        return (
            <div className={styles.companyInfo}>
              <span className={styles.companyName}>
                {row.legalName || 'Unnamed Company'}
              </span>
              <span className={styles.companyMeta}>
                {users} users - {branches} branches
              </span>
            </div>
        );
      },
    },
    {
      header: 'Tenant ID',
      accessor: 'id',
      render:(row)=> <code className={styles.tenantIdCode}>{row.id}</code>
    },
    {
      header:'Status',
      accessor:'status',
      render:(row)=>(
        <Badge status={getBadgeStatus(row.status)}>
          {row.status || '---'}
        </Badge>
      )
    },
    {
      header:'Registered',
      accessor:'createdAt',
      render:(row)=>(
        row.createdAt ? new Date(row.createdAt).toLocaleDateString():'--'
      )
    },
    {
      header:'Actions',
      render:()=>(
        <div className={styles.actionsWrapper} >
          <button type="button" className={styles.actionBtn}>
            Details
          </button>
          <button type="button" className={styles.actionBtn}>
            Edit
          </button>

        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div>
          <h1 className={styles.title}>
            Tenant Companies
          </h1>
        </div>
      </div>

      {/* API Error State*/}
      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* table */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
            <h2 className={styles.sectionTitle}>Registered Organisations Overview</h2>
            
        </div>

          <Table
            columns={columns}
            data={Array.isArray(companiesList)? companiesList:[]}
            loading={loading}
            emptyMessage="No Companies Registered"
          />
      </div>

      

    </div>
  )


}

export default PlatformCompanies;

