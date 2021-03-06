import React, { useState, useReducer, useCallback, useEffect } from "react"
import { useDispatch } from "react-redux"
import { FormControl, Grid, Card, CardHeader, CardContent, Button, InputLabel, Select, MenuItem, CardActions } from "@material-ui/core"
import { TextInputField, MultilineInputField } from "../Common/HelperInputFields"
import AppMessage from "../Common/AppMessage"
import { makeStyles } from "@material-ui/styles";
import { navigate } from 'hookrouter';
import { createFacility, getFacility, updateFacility } from "../../Redux/actions";
import { validateLocationCoordinates, phonePreg } from "../../Constants/common";
import districts from "../../Constants/Static_data/districts.json"
import SaveIcon from '@material-ui/icons/Save';
import { FACILITY_TYPES } from "./constants";
import { Loading } from "../../Components/Common/Loading";

interface FacilityProps {
    facilityId?: number;
}

const initForm: any = {
    name: "",
    district: "",
    address: "",
    phone_number: "",
    latitude: "",
    longitude: "",
    oxygen_capacity: "",
};

const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
};

const useStyles = makeStyles(theme => ({
    formTop: {
        marginTop: '100px',
    },
    pdLogo: {
        height: '345px',
        border: 'solid 3px white'
    },
    selectEmpty: {
        marginTop: "10px",
    },
    selectLabel: {
        background: 'white',
        padding: '0px 10px'
    },
}));

const facility_create_reducer = (state = initialState, action: any) => {

    switch (action.type) {
        case "set_form": {
            return {
                ...state,
                form: action.form
            }
        }
        case "set_error": {
            return {
                ...state,
                errors: action.errors
            }
        }
        default:
            return state
    }
}

export const FacilityCreate = (props: FacilityProps) => {
    const dispatchAction: any = useDispatch()
    const classes = useStyles();
    const { facilityId } = props;

    const [state, dispatch] = useReducer(facility_create_reducer, initialState);
    const [showAppMessage, setAppMessage] = useState({ show: false, message: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);

    const headerText = !facilityId ? "Create Facility" : "Update Facility";
    const buttonText = !facilityId ? "Save" : "Update";

    const fetchData = useCallback(async () => {
        if (facilityId) {
            setIsLoading(true);
            const res = await dispatchAction(getFacility(facilityId));
            if (res.data) {
                const formData = {
                    name: res.data.name,
                    district: res.data.district,
                    address: res.data.address,
                    phone_number: res.data.phone_number,
                    latitude: res.data.location ? res.data.location.latitude : "",
                    longitude: res.data.location ? res.data.location.longitude : "",
                    oxygen_capacity: res.data.oxygen_capacity ? res.data.oxygen_capacity : "",
                };
                dispatch({ type: "set_form", form: formData })
            } else {
                navigate(`/facility/${facilityId}`);
            }
            setIsLoading(false);
        }
    }, [dispatchAction, facilityId]);

    useEffect(() => {
        fetchData();
    }, [dispatch, fetchData]);

    const handleCancel = (e: any) => {
        const form = { ...initForm };
        dispatch({ type: "set_form", form })
        if (facilityId) {
            navigate(`/facility/${facilityId}`);
        } else {
            navigate('/facility');
        }
    };

    const handleChange = (e: any) => {
        let form = { ...state.form }
        form[e.target.name] = e.target.value
        dispatch({ type: "set_form", form })
    }

    const validateForm = () => {
        let errors = { ...initForm }
        let invalidForm = false
        Object.keys(state.form).forEach(field => {
            if (!state.form[field] && (field === "name" || field === "district" || field === "address")) {
                errors[field] = "Field is required";
                invalidForm = true;
            } else if (field === "phone_number" && !phonePreg(state.form.phone_number)) {
                errors[field] = "Please Enter 10/11 digit mobile number or landline as 0<std code><phone number>";
                invalidForm = true;
            } else if (state.form[field] && (field === "latitude" || field === "longitude") && !validateLocationCoordinates(state.form[field])) {
                errors[field] = "Please enter valid coordinates";
                invalidForm = true;
            }
        });
        if (invalidForm) {
            dispatch({ type: "set_error", errors })
            return false
        }
        dispatch({ type: "set_error", errors })
        return true
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const validated = validateForm();
        if (validated) {
            setIsLoading(true);
            const data = {
                facility_type: FACILITY_TYPES.HOSPITAL.id,
                name: state.form.name,
                district: state.form.district,
                address: state.form.address,
                location: state.form.latitude && state.form.latitude ? {
                    latitude: Number(state.form.latitude),
                    longitude: Number(state.form.latitude),
                } : undefined,
                phone_number: state.form.phone_number,
                oxygen_capacity: state.form.oxygen_capacity ? Number(state.form.oxygen_capacity) : undefined,
            }
            const res = await dispatchAction(facilityId ? updateFacility(facilityId, data) : createFacility(data));
            if (res.data) {
                const id = res.data.id;
                setIsLoading(false);
                dispatch({ type: "set_form", form: initForm });
                if (!facilityId) {
                    setAppMessage({ show: true, message: "Facility added successfully", type: "success" });
                    navigate(`/facility/${id}/bed`);
                } else {
                    setAppMessage({ show: true, message: "Facility updated successfully", type: "success" });
                    navigate(`/facility/${facilityId}`);
                }
            }
        }
    }
    if (isLoading) {
        return <Loading />
    }
    return <div>
        <Grid container alignContent="center" justify="center">
            <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
                <Card style={{ marginTop: '20px' }}>
                    <AppMessage open={showAppMessage.show} type={showAppMessage.type} message={showAppMessage.message} handleClose={() => setAppMessage({ show: false, message: "", type: "" })} handleDialogClose={() => setAppMessage({ show: false, message: "", type: "" })} />
                    <CardHeader title={headerText} />
                    <form onSubmit={(e) => handleSubmit(e)}>
                        <CardContent>
                            <Grid container justify="center" style={{ marginBottom: '10px' }}>
                                <Grid item xs={12}>
                                    <TextInputField
                                        fullWidth
                                        name="name"
                                        label="Hospital Name*"
                                        placeholder=""
                                        variant="outlined"
                                        margin="dense"
                                        value={state.form.name}
                                        onChange={handleChange}
                                        errors={state.errors.name}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel id="demo-simple-select-outlined-label" className={classes.selectLabel} >Pick Your District*</InputLabel>
                                        <Select
                                            fullWidth
                                            labelId="demo-simple-select-outlined-label"
                                            id="demo-simple-select-outlined"
                                            name="district"
                                            value={state.form.district}
                                            onChange={handleChange}
                                            label="District"
                                        >
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {districts.map((district) => {
                                                return <MenuItem key={district.id.toString()} value={district.id}>{district.name}</MenuItem>
                                            })}
                                        </Select>
                                        <span className="error-text">{state.errors.district}</span>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12}>
                                    <MultilineInputField
                                        name="address"
                                        label="Hospital Address*"
                                        placeholder=""
                                        variant="outlined"
                                        margin="dense"
                                        value={state.form.address}
                                        onChange={handleChange}
                                        errors={state.errors.address}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12}>
                                    <TextInputField
                                        name="phone_number"
                                        label="Emergency Contact Number*"
                                        type="number"
                                        placeholder=""
                                        variant="outlined"
                                        margin="dense"
                                        value={state.form.phone_number}
                                        onChange={handleChange}
                                        errors={state.errors.phone_number}
                                        inputProps={{ maxLength: 11 }}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12}>
                                    <TextInputField
                                        name="oxygen_capacity"
                                        label="Oxygen Capacity"
                                        type="number"
                                        placeholder=""
                                        variant="outlined"
                                        margin="dense"
                                        value={state.form.oxygen_capacity}
                                        onChange={handleChange}
                                        errors={state.errors.oxygen_capacity}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12}>
                                    <TextInputField
                                        name="latitude"
                                        label="Latitude"
                                        placeholder=""
                                        variant="outlined"
                                        margin="dense"
                                        value={state.form.latitude}
                                        onChange={handleChange}
                                        errors={state.errors.latitude}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12}>
                                    <TextInputField
                                        name="longitude"
                                        label="Longitude"
                                        placeholder=""
                                        variant="outlined"
                                        margin="dense"
                                        value={state.form.longitude}
                                        onChange={handleChange}
                                        errors={state.errors.longitude}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>

                        <CardContent>
                            <CardActions className="padding16" style={{ justifyContent: "space-between" }}>
                                <Button
                                    color="default"
                                    variant="contained"
                                    onClick={handleCancel}
                                >Cancel</Button>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    type="submit"
                                    style={{ marginLeft: 'auto' }}
                                    onClick={(e) => handleSubmit(e)}
                                    startIcon={<SaveIcon>save</SaveIcon>}
                                >{buttonText}</Button>
                            </CardActions>
                        </CardContent>
                    </form>
                </Card>
            </Grid>
        </Grid>
    </div>
}
