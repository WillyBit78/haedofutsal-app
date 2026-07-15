const supabase = require('./supabase');

async function obtenerDatosSocio(identifier) {
  try {
    const target = identifier.toString().trim().toLowerCase();
    const { data: users, error: errU } = await supabase.from('usuarios').select('*').or(`username.ilike.${target},dni.eq.${target}`);
    if (errU || !users || users.length === 0) throw new Error('Usuario no encontrado');
    const u = users[0];
    
    // We search pagos by 'email' column since it now stores the username
    const { data: pagos, error: errP } = await supabase.from('pagos').select('payment_id, username:email, month, amount, status, mp_link, collected_by, collected_at').ilike('email', u.username).order('month', { ascending: true });
    
    const obj = {
      Username: u.username,
      Role: u.role,
      Name: u.name,
      Phone: u.phone,
      Category: u.category,
      DNI: u.dni,
      Birthdate: u.birthdate,
      Age: u.age,
      JoinDate: u.joindate,
      BloodType: u.bloodtype,
      MedicalFit: u.medicalfit,
      ObraSocial: u.obrasocial,
      EmergencyContact: u.emergencycontact,
      EmergencyPhone: u.emergencyphone,
      ParentName: u.parentname,
      ParentPhone: u.parentphone,
      Notes: u.notes,
      Photo: u.photo,
      Pagos: []
    };
    
    if (pagos && pagos.length > 0) {
      obj.Pagos = pagos.map(p => ({
        payment_id: p.payment_id,
        month: p.month,
        amount: p.amount,
        status: p.status,
        mp_link: p.mp_link,
        collected_by: p.collected_by,
        collected_at: p.collected_at
      }));
    }
    
    return obj;
  } catch(e) {
    console.error('obtenerDatosSocio ERROR:', e);
    throw e;
  }
}

async function obtenerDatosAdmin() {
  try {
    const { data: users } = await supabase.from('usuarios').select('*');
    const { data: pagos } = await supabase.from('pagos').select('payment_id, username:email, month, amount, status, mp_link, collected_by, collected_at');
    const { data: categorias } = await supabase.from('categorias').select('*');
    const { data: torneos } = await supabase.from('torneos').select('*');
    const { data: finanzas } = await supabase.from('finanzas_torneos').select('*');
    const { data: partidos } = await supabase.from('partidos').select('*');
    const { data: logs } = await supabase.from('logs_audit').select('id, user_email, action, details, created_at').order('id', { ascending: false }).limit(100);
    
    // Map logs to have username instead of user_email
    const logsMapped = (logs || []).map(l => ({
      ...l,
      Username: l.user_email,
      user_email: undefined
    }));

    // Map users to remove email
    const usersMapped = (users || []).map(u => ({
      ...u,
      Email: undefined,
      email: undefined
    }));
    
    return {
      Usuarios: usersMapped,
      Pagos: pagos || [],
      Categorias: categorias || [],
      Torneos: torneos || [],
      Finanzas_Torneos: finanzas || [],
      Partidos: partidos || [],
      Logs_Audit: logsMapped
    };
  } catch(e) {
    console.error('obtenerDatosAdmin ERROR:', e);
    throw e;
  }
}

module.exports = {
  obtenerDatosSocio,
  obtenerDatosAdmin,
  ejecutarQuery: async (queryObj) => {
    // temporary endpoint to fix data
    try {
      if(queryObj.table === 'usuarios' && queryObj.action === 'update') {
        const { data, error } = await supabase.from(queryObj.table).update(queryObj.updateData).eq(queryObj.eqField, queryObj.eqValue);
        return { data, error };
      }
      return { error: 'Not allowed' };
    } catch(e) { return { error: e.message }; }
  }
};
