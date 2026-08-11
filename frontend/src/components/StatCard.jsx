function StatCard({

    title,

    value,

    color

}){

    return(

        <div className="col-lg-4 col-md-6 mb-4">

            <div className={`card stat-card bg-${color} text-white`}>

                <div className="card-body text-center">

                    <h5>

                        {title}

                    </h5>

                    <h1 className="fw-bold">

                        {value ?? 0}

                    </h1>

                </div>

            </div>

        </div>

    );

}

export default StatCard;