-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'atendente', 'medico');

-- Create enum for doctor status
CREATE TYPE public.doctor_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for consultation type
CREATE TYPE public.consultation_type AS ENUM ('teleconsulta', 'renovacao_receita');

-- Create enum for consultation status
CREATE TYPE public.consultation_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create doctors table
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    crm TEXT NOT NULL,
    specialty TEXT NOT NULL,
    status doctor_status DEFAULT 'pending' NOT NULL,
    is_available BOOLEAN DEFAULT false NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Create consultations table
CREATE TABLE public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_cpf TEXT NOT NULL,
    consultation_type consultation_type NOT NULL,
    specialty TEXT NOT NULL,
    description TEXT,
    urgency TEXT NOT NULL,
    status consultation_status DEFAULT 'pending' NOT NULL,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON public.doctors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON public.consultations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for doctors
CREATE POLICY "Doctors can view their own data"
    ON public.doctors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all doctors"
    ON public.doctors FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Atendentes can view approved doctors"
    ON public.doctors FOR SELECT
    USING (public.has_role(auth.uid(), 'atendente') AND status = 'approved');

CREATE POLICY "Anyone can insert doctor profile"
    ON public.doctors FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own availability"
    ON public.doctors FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any doctor"
    ON public.doctors FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for consultations
CREATE POLICY "Atendentes can view all consultations"
    ON public.consultations FOR SELECT
    USING (public.has_role(auth.uid(), 'atendente'));

CREATE POLICY "Admins can view all consultations"
    ON public.consultations FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can view their consultations"
    ON public.consultations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.doctors
            WHERE doctors.id = consultations.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

CREATE POLICY "Atendentes can create consultations"
    ON public.consultations FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'atendente'));

CREATE POLICY "Admins can create consultations"
    ON public.consultations FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can update their consultations"
    ON public.consultations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.doctors
            WHERE doctors.id = consultations.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update any consultation"
    ON public.consultations FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Atendentes can update consultations"
    ON public.consultations FOR UPDATE
    USING (public.has_role(auth.uid(), 'atendente'));